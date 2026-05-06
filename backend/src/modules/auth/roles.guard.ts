import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: string } | undefined;
    if (user?.role !== "admin") throw new ForbiddenException("Admin only");
    return true;
  }
}

