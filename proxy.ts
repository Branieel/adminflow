import { auth } from "@/auth";

export const proxy = auth((request) => {
  const isLoggedIn = !!request.auth;
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(
      new URL("/login", request.nextUrl.origin)
    );
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(
      new URL("/dashboard", request.nextUrl.origin)
    );
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/login",
  ],
};