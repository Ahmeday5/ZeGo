export type CarType = 'Car' | 'Motorcycle' | 'Delivery' | 'PinkCar' | 'PinkMotorcycle';

export const CAR_TYPES: CarType[] = ['Car', 'Motorcycle', 'Delivery', 'PinkCar', 'PinkMotorcycle'];

export const CAR_TYPE_LABELS: Record<CarType, string> = {
  Car: 'سيارة',
  Motorcycle: 'موتوسيكل',
  Delivery: 'ديليفري',
  PinkCar: 'سيارة نسائي',
  PinkMotorcycle: 'موتوسيكل نسائي',
};

export function carTypeLabel(carType?: string | null): string {
  if (!carType) return 'غير محدد';
  return CAR_TYPE_LABELS[carType as CarType] ?? carType;
}

export type Gender = 'Male' | 'Female';

export const GENDERS: Gender[] = ['Male', 'Female'];

export const GENDER_LABELS: Record<Gender, string> = {
  Male: 'ذكر',
  Female: 'أنثى',
};

export function genderLabel(gender?: string | null): string {
  if (!gender) return 'غير محدد';
  return GENDER_LABELS[gender as Gender] ?? gender;
}
