export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "doctor" | "staff" | "patient";
  phone?: string;
  isActive: boolean;
  doctor?: Doctor;
  staff?: Staff;
}

export interface Doctor {
  id: string;
  userId: string;
  user?: User;
  specialization: string;
  licenseNumber?: string;
  polyclinicId?: string;
  polyclinic?: Polyclinic;
  schedule?: Record<string, { start: string; end: string }>;
}

export interface Staff {
  id: string;
  userId: string;
  department?: string;
  position?: string;
}

export interface Patient {
  id: string;
  medicalRecordNumber: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string;
}

export interface Polyclinic {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface QueueNumber {
  id: string;
  polyclinicId: string;
  polyclinic: Polyclinic;
  patientId: string;
  patient: Patient;
  queueNumber: number;
  queueDate: string;
  status: "waiting" | "called" | "serving" | "completed" | "skipped";
  checkInTime: string;
  calledTime?: string;
  servedTime?: string;
  completedTime?: string;
  doctorId?: string;
  doctor?: Doctor;
  notes?: string;
}

export interface QueueState {
  polyclinic: Polyclinic;
  currentlyServing?: QueueNumber;
  lastCalled?: QueueNumber;
  waiting: QueueNumber[];
  completed: QueueNumber[];
  skipped: QueueNumber[];
  total: number;
}

export interface QueueDisplayItem {
  polyclinic: Polyclinic;
  currentNumber: number;
  waitingCount: number;
  status: "waiting" | "called" | "serving";
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category?: string;
  unit?: string;
  minStock: number;
  currentStock: number;
  price?: number;
  description?: string;
  isActive: boolean;
}

export interface StockOpname {
  id: string;
  opnameDate: string;
  status: "draft" | "in_progress" | "completed";
  notes?: string;
  createdBy: string;
  creator: User;
  completedAt?: string;
  items: StockOpnameItem[];
}

export interface StockOpnameItem {
  id: string;
  stockOpnameId: string;
  itemId: string;
  item: Item;
  systemQty: number;
  actualQty: number | null;
  notes?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  patientId?: string;
  patient?: Patient;
  folderId?: string;
  folder?: DocumentFolder;
  uploadedBy: string;
  uploader: User;
  isConfidential: boolean;
  createdAt: string;
  accessList?: DocumentAccess[];
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  parentFolder?: DocumentFolder;
  children?: DocumentFolder[];
  documents?: Document[];
  createdBy: string;
  creator?: User;
  createdAt: string;
}

export type AccessCriteriaType = "user" | "role" | "polyclinic" | "doctor";
export type AccessType = "view" | "edit" | "delete" | "full";

export interface DocumentAccess {
  id: string;
  documentId?: string;
  document?: Document;
  folderId?: string;
  folder?: DocumentFolder;
  accessCriteriaType: AccessCriteriaType;
  userId?: string;
  user?: User;
  role?: string;
  polyclinicId?: string;
  polyclinic?: Polyclinic;
  doctorId?: string;
  doctor?: Doctor;
  accessType: AccessType;
  grantedBy: string;
  grantor?: User;
  expiresAt?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  user?: User;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  checkInLocation?: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  checkInPhoto?: string;
  checkOutPhoto?: string;
  status: "present" | "late" | "absent" | "leave" | "sick";
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  user: User;
  leaveType: "annual" | "sick" | "emergency";
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approver?: User;
  approvedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
