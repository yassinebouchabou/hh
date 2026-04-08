
'use server';
/**
 * @fileOverview A Genkit flow for validating delivery partner credentials and fetching mock tariffs.
 *
 * - validateDeliveryCredentials - A function that simulates a handshake with the delivery API.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TariffSchema = z.object({
  stateName: z.string(),
  homePrice: z.number(),
  deskPrice: z.number(),
  estimatedDays: z.string(),
});

const ValidateDeliveryCredentialsInputSchema = z.object({
  apiKey: z.string().describe('The delivery API key.'),
  xTenant: z.string().optional().describe('The tenant ID.'),
  company: z.string().describe('The selected delivery company name.'),
});
export type ValidateDeliveryCredentialsInput = z.infer<typeof ValidateDeliveryCredentialsInputSchema>;

const ValidateDeliveryCredentialsOutputSchema = z.object({
  valid: z.boolean().describe('Whether the credentials are valid.'),
  message: z.string().describe('Feedback message.'),
  companyName: z.string().optional().describe('The identified name of the validated delivery company.'),
  logoUrl: z.string().optional().describe('The URL of the delivery company logo.'),
  tariffs: z.array(TariffSchema).optional().describe('The fetched delivery tariffs for this partner.'),
});
export type ValidateDeliveryCredentialsOutput = z.infer<typeof ValidateDeliveryCredentialsOutputSchema>;

export async function validateDeliveryCredentials(
  input: ValidateDeliveryCredentialsInput
): Promise<ValidateDeliveryCredentialsOutput> {
  return validateDeliveryCredentialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateDeliveryPrompt',
  input: {schema: ValidateDeliveryCredentialsInputSchema},
  output: {schema: ValidateDeliveryCredentialsOutputSchema},
  prompt: `You are an API validator for OUTILYA DZ.
  
Validate the credentials for the delivery partner: {{{company}}}
API Key (secretKey): {{{apiKey}}}
Tenant ID (xTenant): {{{xTenant}}}

Validation Logic:
1. API Key must be at least 20 characters long to be considered technically valid.
2. Identify the company based on the key prefix or overall format. 
   - Long strings starting with '15z' or containing many characters are typically ZR EXPRESS.
   - Keys starting with 'YL' are Yalidine.
3. If valid, set "valid" to true.

Output Requirements:
- valid: true if credentials look correct.
- message: A technical confirmation in Arabic stating that the API handshake was successful and account is linked.
- companyName: The identified name of the partner (e.g., "ZR EXPRESS").
- logoUrl: 
   - If the company is "ZR EXPRESS" or identified as such, use exactly: "https://6000-firebase-studio-1774968311666.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev/api/v1/attachments/cm7bt66060001kd0860000000"
   - Otherwise, use a professional placeholder.
- tariffs: Generate a full array of delivery tariffs for ALL 69 Algerian wilayas (states 01 to 69, including the 2026 expansion).
   - stateName format: "XX - ArabicName" (e.g., "16 - الجزائر").
   - Prices: Algiers/Blida ~ 400-500 DA, North ~ 600-750 DA, South ~ 900-1200 DA.
   - Desk prices (retrait au bureau) must be exactly 200 DA cheaper than home prices.
   - estimatedDays: "24h-48h" for North, "3-5 jours" for South.

You MUST return a complete list of 69 tariffs covering all wilayas up to 69.`,
});

const validateDeliveryCredentialsFlow = ai.defineFlow(
  {
    name: 'validateDeliveryCredentialsFlow',
    inputSchema: ValidateDeliveryCredentialsInputSchema,
    outputSchema: ValidateDeliveryCredentialsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI failed to return validation results');
      }
      return output;
    } catch (error) {
      console.error("Flow error:", error);
      return {
        valid: false,
        message: "خطأ في الاتصال بالخادم. يرجى التحقق من المفتاح والمحاولة مرة أخرى."
      };
    }
  }
);
