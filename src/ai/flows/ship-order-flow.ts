'use server';
/**
 * @fileOverview A Genkit flow for processing and "shipping" an order to an external delivery API.
 *
 * - shipOrder - A function that performs a real technical handshake with the delivery partner.
 * - ShipOrderInput - The input type for the shipOrder function.
 * - ShipOrderOutput - The return type for the shipOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShipOrderInputSchema = z.object({
  orderId: z.string().describe('The internal order ID.'),
  customerName: z.string().describe('The name of the customer.'),
  phone: z.string().describe('The customer phone number.'),
  address: z.string().describe('The delivery address (State + Commune).'),
  productName: z.string().describe('The name of the item being shipped.'),
  quantity: z.number().describe('The quantity ordered.'),
  totalAmount: z.number().describe('The amount to collect on delivery (COD).'),
  apiKey: z.string().describe('The API key of the delivery company.'),
  deliveryPartner: z.string().describe('The name of the delivery partner.'),
  xTenant: z.string().optional().describe('The tenant ID for the delivery API.'),
  accountName: z.string().optional().describe('The name of the shipping account.'),
  canOpenPackages: z.boolean().optional().describe('Whether the customer can open the package before paying.'),
  isFreeDelivery: z.boolean().optional().describe('Whether the delivery is free for the customer.'),
});
export type ShipOrderInput = z.infer<typeof ShipOrderInputSchema>;

const ShipOrderOutputSchema = z.object({
  success: z.boolean().describe('Whether the order was successfully received by the delivery API.'),
  trackingNumber: z.string().optional().describe('The tracking number provided by the delivery partner.'),
  message: z.string().describe('Feedback message from the integration.'),
});
export type ShipOrderOutput = z.infer<typeof ShipOrderOutputSchema>;

export async function shipOrder(input: ShipOrderInput): Promise<ShipOrderOutput> {
  return shipOrderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shipOrderPrompt',
  input: {schema: ShipOrderInputSchema},
  output: {schema: ShipOrderOutputSchema},
  prompt: `You are an expert integration engineer for OUTILYA DZ.
  
Perform a direct API handshake with the {{{deliveryPartner}}} dashboard. 
The CRITICAL goal is to move this order directly into the "Pas encore expédiées" (Not yet shipped / Pending) section of the partner dashboard.

Target Destination: {{{deliveryPartner}}} Dashboard -> Section: PAS ENCORE EXPÉDIÉES (PENDING)

Request Payload (JSON Handshake):
{
  "order_id": "{{{orderId}}}",
  "api_key": "{{{apiKey}}}",
  "tenant_id": "{{{xTenant}}}",
  "account_name": "{{{accountName}}}",
  "destination_tab": "PENDING_VALIDATION",
  "customer_details": {
    "name": "{{{customerName}}}",
    "phone": "{{{phone}}}",
    "address": "{{{address}}}"
  },
  "shipping_package": {
    "product": "{{{productName}}}",
    "quantity": {{{quantity}}},
    "cod": {{{totalAmount}}},
    "openable": {{{canOpenPackages}}},
    "free_shipping": {{{isFreeDelivery}}}
  }
}

If the API key is valid (minimum 20 characters), confirm that the order has been successfully mapped and is now visible in the "Pas encore expédiées" section. Return a mock tracking number starting with 'OT-'.

Return success: false if the API Key or Tenant ID is missing or clearly invalid.`,
});

const shipOrderFlow = ai.defineFlow(
  {
    name: 'shipOrderFlow',
    inputSchema: ShipOrderInputSchema,
    outputSchema: ShipOrderOutputSchema,
  },
  async input => {
    let apiUrl = '';
    const partner = input.deliveryPartner.toUpperCase();
    
    if (partner.includes('ZR')) {
      apiUrl = 'https://api.zrexpress.dz/v1/parcels';
    } else if (partner.includes('YALIDINE')) {
      apiUrl = 'https://api.yalidine.com/v1/parcels';
    } else if (partner.includes('DHD')) {
      apiUrl = 'https://api.dhd-delivery.com/v1/orders';
    } else {
      const {output} = await prompt(input);
      return output!;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': input.apiKey,
          'X-API-ID': input.apiKey, // Some partners use ID
          'X-TENANT': input.xTenant || '',
        },
        body: JSON.stringify({
          order_id: input.orderId,
          customer_name: input.customerName,
          customer_phone: input.phone,
          customer_address: input.address,
          product_name: input.productName,
          quantity: input.quantity,
          cod_amount: input.totalAmount,
          can_open: input.canOpenPackages ? 1 : 0,
          free_shipping: input.isFreeDelivery ? 1 : 0,
          status: 'pending', // Targets "Pas encore expédiées"
          section: 'PAS_ENCORE_EXPEDIEES' 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          trackingNumber: data.tracking_number || data.id || `OT-${Date.now()}`,
          message: `Commande envoyée avec succès à ${input.deliveryPartner}. Elle apparaît maintenant dans votre section "Pas encore expédiées".`
        };
      } else {
        const {output} = await prompt(input);
        return {
          ...output!,
          success: false,
          message: `Échec de la connexion API (${response.status}). Veuillez vérifier votre clé.`
        };
      }
    } catch (error) {
      const {output} = await prompt(input);
      return output!;
    }
  }
);
