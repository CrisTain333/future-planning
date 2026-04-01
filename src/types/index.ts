export interface IUser {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  profilePicture?: string;
  role: "admin" | "user";
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  userId: string | IUser;
  month: number;
  year: number;
  amount: number;
  penalty: number;
  penaltyReason?: string;
  note?: string;
  receiptNo: string;
  status: "approved" | "deleted";
  approvedBy: string | IUser;
  isDeleted: boolean;
  deletedBy?: string | IUser;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotice {
  _id: string;
  title: string;
  body: string;
  createdBy: string | IUser;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: "payment_recorded" | "notice_posted";
  title: string;
  message: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  action:
    | "payment_created"
    | "payment_edited"
    | "payment_deleted"
    | "user_created"
    | "user_edited"
    | "user_disabled"
    | "user_enabled"
    | "notice_created"
    | "notice_edited"
    | "notice_deleted"
    | "settings_updated";
  performedBy: string | IUser;
  targetUser?: string | IUser;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface ISettings {
  _id: string;
  foundationName: string;
  monthlyAmount: number;
  initialAmount: number;
  startMonth: number;
  startYear: number;
  skippedMonths?: { month: number; year: number; reason?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionUser {
  userId: string;
  role: "admin" | "user";
  fullName: string;
}
