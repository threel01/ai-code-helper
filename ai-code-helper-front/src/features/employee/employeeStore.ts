export type Employee = {
  id: string;
  employeeCode: string;
  phone?: string;
  chineseName?: string;
  email?: string;
  totalDiscountRate?: number;
  monthlyTotalLimit?: number;
  extraDiscountRate?: number;
  extraStart?: string; // yyyy-MM-dd
  extraEnd?: string; // yyyy-MM-dd
  createTime: string; // ISO string
};
