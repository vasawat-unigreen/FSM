// Central Thai string dictionary. The app is Thai-first; keep all
// user-facing copy here (or in components referencing these maps) so wording
// stays consistent.
import type {
  JobStatus,
  JobType,
  JobPriority,
  UserRole,
  CustomerType,
  LineItemType,
  AppointmentStatus,
} from "@/generated/prisma/client";

export const t = {
  appName: "FSM",
  appTagline: "ระบบจัดการงานบริการภาคสนาม",

  // Auth
  signIn: "เข้าสู่ระบบ",
  signOut: "ออกจากระบบ",
  createAccount: "สร้างบัญชี",
  email: "อีเมล",
  password: "รหัสผ่าน",
  companyName: "ชื่อบริษัท",
  yourName: "ชื่อของคุณ",
  noAccount: "ยังไม่มีบัญชี?",
  haveAccount: "มีบัญชีอยู่แล้ว?",
  createOne: "สมัครใช้งาน",

  // Common actions
  save: "บันทึก",
  saveChanges: "บันทึกการเปลี่ยนแปลง",
  cancel: "ยกเลิก",
  create: "สร้าง",
  edit: "แก้ไข",
  delete: "ลบ",
  remove: "นำออก",
  add: "เพิ่ม",
  search: "ค้นหา",
  back: "กลับ",
  post: "ส่ง",
  update: "อัปเดต",
  pleaseWait: "กรุณารอสักครู่…",
  all: "ทั้งหมด",
  none: "ไม่มี",
  optional: "(ไม่บังคับ)",
  themeToggle: "สลับโหมดสว่าง/มืด",
  dayMode: "โหมดสว่าง",
  nightMode: "โหมดมืด",

  // Nav
  nav: {
    dashboard: "แดชบอร์ด",
    customers: "ลูกค้า",
    jobs: "งาน",
    schedule: "ตารางงาน",
    estimates: "ใบเสนอราคา",
    invoices: "ใบแจ้งหนี้",
    inventory: "คลังอะไหล่",
    settings: "ตั้งค่า",
  },

  // Dashboard
  dashboard: "แดชบอร์ด",
  dashboardSubtitle: "ภาพรวมระบบจัดการงานบริการภาคสนาม",

  // Customers
  customers: "ลูกค้า",
  newCustomer: "เพิ่มลูกค้า",
  searchByName: "ค้นหาจากชื่อ…",
  noCustomers: "ยังไม่มีลูกค้า",
  name: "ชื่อ",
  type: "ประเภท",
  sites: "สถานที่",
  jobsCount: "งาน",
  billingAddress: "ที่อยู่สำหรับวางบิล",
  paymentTerms: "เงื่อนไขการชำระเงิน",
  contacts: "ผู้ติดต่อ",
  noContacts: "ยังไม่มีผู้ติดต่อ",
  sitesAndAssets: "สถานที่และอุปกรณ์",
  noSites: "ยังไม่มีสถานที่",
  noAssets: "ไม่มีอุปกรณ์",
  history: "ประวัติ",
  noActivity: "ยังไม่มีความเคลื่อนไหว",
  primary: "หลัก",
  phone: "โทรศัพท์",
  role: "ตำแหน่ง",
  address: "ที่อยู่",
  label: "ป้ายชื่อ",
  gateCode: "รหัสประตู",
  accessNotes: "หมายเหตุการเข้าถึง",
  addSite: "เพิ่มสถานที่",
  addAsset: "เพิ่มอุปกรณ์",
  equipmentName: "ชื่ออุปกรณ์",
  make: "ยี่ห้อ",
  model: "รุ่น",
  serial: "หมายเลขซีเรียล",
  backToCustomers: "← กลับไปหน้าลูกค้า",

  // Settings
  settings: "ตั้งค่า",
  team: "ทีมงาน",
  status: "สถานะ",
  active: "ใช้งาน",
  inactive: "ปิดใช้งาน",

  // Jobs
  jobs: "งาน",
  newJob: "สร้างงานใหม่",
  noJobs: "ไม่พบงาน",
  myJobs: "งานที่ได้รับมอบหมาย",
  shown: "รายการ",
  summary: "หัวข้องาน",
  description: "รายละเอียด",
  customer: "ลูกค้า",
  technician: "ช่าง",
  priority: "ความสำคัญ",
  assignTechnician: "มอบหมายช่าง",
  unassigned: "ยังไม่ได้มอบหมาย",
  selectCustomer: "เลือกลูกค้า…",
  createJob: "สร้างงาน",
  needCustomerFirst: "ต้องมีลูกค้าก่อนจึงจะสร้างงานได้",
  createCustomerFirst: "สร้างลูกค้า",
  workflow: "ขั้นตอนงาน",
  lineItems: "รายการ",
  noLineItems: "ยังไม่มีรายการ",
  qty: "จำนวน",
  unit: "ราคาต่อหน่วย",
  total: "รวม",
  subtotal: "ยอดรวมย่อย",
  tax: "ภาษี",
  activityAndNotes: "ความเคลื่อนไหวและบันทึก",
  addNote: "เพิ่มบันทึก…",
  details: "ข้อมูลงาน",
  site: "สถานที่",
  created: "สร้างเมื่อ",
  noSite: "ไม่มีสถานที่",
  setSiteFromEdit: "ตั้งค่าสถานที่ได้จากหน้าแก้ไข",
  scheduledStart: "เริ่มตามนัด",
  scheduledEnd: "สิ้นสุดตามนัด",
  updateAssignment: "อัปเดตการมอบหมาย",
  backToJobs: "← กลับไปหน้างาน",
  description2: "สิ่งที่ต้องทำ",

  // Schedule / dispatch
  schedule: "ตารางงาน",
  dispatchBoard: "กระดานจัดงาน",
  today: "วันนี้",
  prevDay: "← ก่อนหน้า",
  nextDay: "ถัดไป →",
  unscheduled: "งานที่ยังไม่ได้จัดตาราง",
  noUnscheduled: "ไม่มีงานค้างจัดตาราง",
  scheduleJob: "จัดตาราง",
  noAppointments: "ไม่มีนัดหมาย",
  duration: "ระยะเวลา",
  minutes: "นาที",
  conflictWarning: "ช่วงเวลานี้ทับซ้อนกับนัดหมายอื่น",
  dragHint: "ลากการ์ดงานเพื่อย้ายไปยังช่างคนอื่น",
  startTime: "เวลาเริ่ม",

  // Field / mobile app
  field: {
    title: "ภาคสนาม",
    myDay: "งานของฉันวันนี้",
    noJobsToday: "วันนี้ยังไม่มีงานที่ได้รับมอบหมาย",
    open: "เปิดงาน",
    enRoute: "ออกเดินทาง",
    startTimer: "เริ่มจับเวลา",
    stopTimer: "หยุดจับเวลา",
    timerRunning: "กำลังจับเวลา",
    timeEntries: "บันทึกเวลา",
    elapsed: "เวลาที่ใช้",
    complete: "ปิดงาน (เสร็จ)",
    parts: "อะไหล่ที่ใช้",
    addPart: "เพิ่มอะไหล่",
    partName: "ชื่ออะไหล่",
    price: "ราคา",
    photos: "รูปถ่ายหน้างาน",
    addPhoto: "ถ่าย/อัปโหลดรูป",
    noPhotos: "ยังไม่มีรูป",
    signature: "ลายเซ็นรับงาน",
    signHere: "เซ็นรับงานโดยลูกค้าตรงนี้",
    saveSignature: "บันทึกลายเซ็น",
    clear: "ล้าง",
    signed: "เซ็นรับงานแล้ว",
    backToMyDay: "← กลับไปงานของฉัน",
    office: "สำนักงาน →",
    customer: "ลูกค้า",
    status: "สถานะ",
  },
} as const;

// --- Enum label maps -------------------------------------------------------

export const jobStatusTh: Record<JobStatus, string> = {
  DRAFT: "ฉบับร่าง",
  SCHEDULED: "นัดหมายแล้ว",
  DISPATCHED: "ส่งช่างแล้ว",
  EN_ROUTE: "กำลังเดินทาง",
  IN_PROGRESS: "กำลังดำเนินการ",
  ON_HOLD: "พักงาน",
  COMPLETED: "เสร็จสิ้น",
  INVOICED: "ออกใบแจ้งหนี้แล้ว",
  CLOSED: "ปิดงาน",
  CANCELLED: "ยกเลิก",
};

export const jobTypeTh: Record<JobType, string> = {
  INSTALL: "ติดตั้ง",
  REPAIR: "ซ่อม",
  MAINTENANCE: "บำรุงรักษา",
  INSPECTION: "ตรวจสอบ",
  EMERGENCY: "ฉุกเฉิน",
};

export const jobPriorityTh: Record<JobPriority, string> = {
  LOW: "ต่ำ",
  NORMAL: "ปกติ",
  HIGH: "สูง",
  URGENT: "ด่วน",
};

export const roleTh: Record<UserRole, string> = {
  OWNER: "เจ้าของ",
  ADMIN: "ผู้ดูแล",
  DISPATCHER: "ผู้จัดงาน",
  TECHNICIAN: "ช่าง",
  ACCOUNTANT: "ฝ่ายบัญชี",
  READ_ONLY: "อ่านอย่างเดียว",
};

export const customerTypeTh: Record<CustomerType, string> = {
  RESIDENTIAL: "ที่พักอาศัย",
  COMMERCIAL: "เชิงพาณิชย์",
};

export const lineItemTypeTh: Record<LineItemType, string> = {
  LABOR: "ค่าแรง",
  PART: "อะไหล่",
  FEE: "ค่าธรรมเนียม",
  DISCOUNT: "ส่วนลด",
};

export const appointmentStatusTh: Record<AppointmentStatus, string> = {
  SCHEDULED: "นัดหมาย",
  EN_ROUTE: "กำลังเดินทาง",
  ARRIVED: "ถึงแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มาตามนัด",
};
