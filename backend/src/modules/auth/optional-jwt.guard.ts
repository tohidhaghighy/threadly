import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ExtractJwt } from "passport-jwt";

/** Allows unauthenticated access; attaches `req.user` when a valid Bearer token is present. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) return true;
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  override handleRequest<TUser>(err: unknown, user: TUser): TUser | undefined {
    if (err) return undefined;
    return user;
  }
}
