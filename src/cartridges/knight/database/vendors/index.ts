/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMerchantCatalog, VendorItemEntry } from './wandering_merchant';

export const VENDOR_ITEMS: VendorItemEntry[] = getMerchantCatalog();

export * from './wandering_merchant';
