import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  alertCircleOutline,
  cartOutline,
  checkmarkCircleOutline,
  logOutOutline,
  moonOutline,
  removeCircleOutline,
  searchOutline,
  sunnyOutline,
  trashOutline,
  waterOutline,
} from 'ionicons/icons';

export function registerAppIcons(): void {
  addIcons({
    'cart-outline': cartOutline,
    'trash-outline': trashOutline,
    'add-circle-outline': addCircleOutline,
    'remove-circle-outline': removeCircleOutline,
    'log-out-outline': logOutOutline,
    'moon-outline': moonOutline,
    'sunny-outline': sunnyOutline,
    'checkmark-circle-outline': checkmarkCircleOutline,
    'alert-circle-outline': alertCircleOutline,
    'search-outline': searchOutline,
    'water-outline': waterOutline,
  });
}
