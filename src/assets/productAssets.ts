import basmatiRiceImg from './images/prod_basmati_rice_1794812251081.jpg';
import pinkSaltImg from './images/prod_pink_salt_1794812252299.jpg';
import surgicalSteelImg from './images/prod_surgical_steel_1794812251959.jpg';
import waterPumpImg from './images/prod_water_pump_1794812253131.jpg';
import greenCardamomImg from './images/prod_green_cardamom_1794812253700.jpg';
import denimFabricImg from './images/prod_denim_fabric_1794812253182.jpg';
import heritageSkylineImg from './images/heritage_pakistan_skyline_1794812254447.jpg';

export const BUNDLED_PRODUCT_ASSETS = {
  basmatiRiceImg,
  pinkSaltImg,
  surgicalSteelImg,
  waterPumpImg,
  greenCardamomImg,
  denimFabricImg,
  heritageSkylineImg,
};

export const LEGACY_ASSET_PATH_MAP: Record<string, string> = {
  '/src/assets/images/prod_basmati_rice_1794812251081.jpg': basmatiRiceImg,
  '/src/assets/images/prod_pink_salt_1794812252299.jpg': pinkSaltImg,
  '/src/assets/images/prod_surgical_steel_1794812251959.jpg': surgicalSteelImg,
  '/src/assets/images/prod_water_pump_1794812253131.jpg': waterPumpImg,
  '/src/assets/images/prod_green_cardamom_1794812253700.jpg': greenCardamomImg,
  '/src/assets/images/prod_denim_fabric_1794812253182.jpg': denimFabricImg,
};

export function getFallbackProductImage(category: 'farm_mining' | 'factory' | 'wholesale', city = ''): string {
  if (category === 'farm_mining') {
    return city.toLowerCase().includes('khewra') ? pinkSaltImg : basmatiRiceImg;
  }
  if (category === 'factory') {
    return surgicalSteelImg;
  }
  return greenCardamomImg;
}
