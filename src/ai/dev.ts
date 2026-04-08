
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-product-description-flow.ts';
import '@/ai/flows/ship-order-flow.ts';
import '@/ai/flows/validate-delivery-credentials-flow.ts';
