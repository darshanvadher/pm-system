# app/api

Next.js Route Handlers only (`route.ts` files). Each handler stays thin:
parse/validate the request with Zod, call into `lib/`, return a response.
Business logic and DB access do not belong in this folder.
