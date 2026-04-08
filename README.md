# OUTILYA DZ - Professional Tool Store

This is a modern e-commerce platform for professional tools in Algeria, built with Next.js, Firebase, and Genkit AI.

## Deployment Guide (Firebase App Hosting)

To publish your website to the internet, you must move your project to the **Blaze Plan**. Follow these steps:

1. **Firebase Console**: Go to the [Firebase Console](https://console.firebase.google.com/).
2. **Upgrade Plan**: Click on "Modify" or "Upgrade" at the bottom of the sidebar. You must select the **Blaze (Pay-as-you-go)** plan.
   - *Note: If you get a billing error here, check that your Google account has the "Billing Account Administrator" role.*
3. **App Hosting Setup**: 
   - Navigate to the **App Hosting** section in the Firebase sidebar.
   - Click "Get Started" and connect your GitHub repository.
   - The setup wizard will automatically detect the Next.js framework.
4. **Environment Variables**: If you are using Genkit/AI features, remember to add your `GOOGLE_GENAI_API_KEY` in the App Hosting dashboard under "Environment Variables" once the app is created.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firestore (NoSQL)
- **Auth**: Firebase Authentication (Google & Email/Pass)
- **AI**: Genkit with Google Gemini 2.0 Flash
- **Styling**: Tailwind CSS & ShadCN UI components

## Development

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
