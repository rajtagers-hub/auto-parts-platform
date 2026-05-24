export interface User {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  status: 'Active' | 'Suspended' | 'Pending';
  created_at: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
  business_license?: string;
  license_verified?: boolean;
  user_type?: string;
  current_debt?: number;
}

export interface Part {
  id: string;
  title: string;
  description?: string;
  price: number;
  model: string;
  year: number;
  category?: string;
  oem_number?: string;
  condition?: string;
  quantity?: number;
  image_url?: string;
  seller_id: string;
  status: 'Active' | 'Sold' | 'Archived' | 'Deleted';
  created_at: string;
  leads_count?: number;
  leads_processed?: number;
  views?: number;
  leads?: number;
  date?: string;
  users?: Partial<User>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_date: string;
  created_at: string;
  date?: string;
  method?: string;
  admin_notes?: string;
  users?: Partial<User>;
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  users?: Partial<User>;
}

export interface Dispute {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  part_id?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  admin_notes?: string;
  reporter?: Partial<User>;
  reported_user?: Partial<User>;
  part?: Partial<Part>;
}

export interface Category {
  id: string;
  name: string;
  type: 'brand' | 'part_category';
  is_active: boolean;
  created_at: string;
}

export interface UserGarage {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  created_at: string;
}

export interface SavedPart {
  id: string;
  user_id: string;
  part_id: string;
  created_at: string;
  parts?: Partial<Part>;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  users?: Partial<User>; // Reviewer info
}

export interface BuyerLead {
  id: string;
  buyer_id: string;
  seller_id: string;
  part_id: string;
  status: 'contacted' | 'sold' | 'cancelled';
  created_at: string;
  parts?: Partial<Part>;
  users?: Partial<User>; // For seller or buyer info depending on context
}

