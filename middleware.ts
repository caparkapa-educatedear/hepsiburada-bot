import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token }) => {
            // return !!token; // Any logged in user
            return token?.role === "ADMIN" || token?.role === "USER"; // Check role if needed
        },
    },
});

export const config = { matcher: ["/admin/:path*"] };
