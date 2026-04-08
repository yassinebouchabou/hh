# **App Name**: PixelCart

## Core Features:

- Product Catalog Browsing: Users can browse a curated list of products, view high-quality images, and access detailed information for each item.
- Secure User Authentication: Comprehensive user registration, login, and logout functionalities, secured with JSON Web Tokens (JWT) for session management.
- Admin Product Management (CRUD): Authorized administrators can seamlessly create, retrieve, update, and delete product listings. This includes handling product images uploaded via a cloud service like Cloudinary.
- Product Description Generation Tool: An integrated AI tool for administrators to efficiently generate compelling product descriptions based on minimal input like product name and category, enhancing content creation.
- Basic Shopping Cart: Users can add items to a shopping cart, modify quantities, remove products, and proceed to a placeholder checkout process for an essential e-commerce experience.
- Admin Dashboard with Protected Routes: A dedicated, secure administrator dashboard for managing products. This ensures that administrative functionalities are only accessible to authorized personnel.

## Style Guidelines:

- Primary color: A balanced and authoritative medium blue, rgb(51, 102, 153) or #336699. It evokes trust and professionalism, anchoring the user interface.
- Background color: A subtly desaturated, light blue, rgb(238, 245, 250) or #EEF5FA. This provides a clean, modern, and unobtrusive canvas, ensuring product content stands out.
- Accent color: A vibrant yet clean cyan, rgb(77, 219, 219) or #4DDBDB. This contrasting accent will draw attention to call-to-action buttons, interactive elements, and highlights.
- Body and headline font: 'Inter' (sans-serif) has been selected for its clean, objective, and highly legible characteristics. Its modern aesthetic ensures readability across various screen sizes and text densities, perfect for product descriptions and UI elements.
- Employ a consistent set of minimal, outlined icons for navigation, product actions (e.g., add to cart, view details), and admin tools, ensuring clarity and ease of recognition within the interface.
- Product listings will feature a responsive grid layout that adapts gracefully to different screen sizes. The admin dashboard will utilize a clear two-column structure, separating navigation (sidebar) from content management areas.
- Implement subtle, purposeful animations to enhance user experience, such as smooth hover effects on product cards, graceful transitions when adding items to the cart, and clear loading indicators for data operations.