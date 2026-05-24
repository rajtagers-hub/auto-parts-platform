-- 1. Krijo tabelën e Garazhit të Blerësit
CREATE TABLE IF NOT EXISTS public.user_garage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_garage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own garage." ON public.user_garage 
FOR ALL USING (auth.uid() = user_id);


-- 2. Krijo tabelën e Wishlist (Pjesët e Ruajtura)
CREATE TABLE IF NOT EXISTS public.saved_parts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.parts(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, part_id)
);

ALTER TABLE public.saved_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wishlist." ON public.saved_parts 
FOR ALL USING (auth.uid() = user_id);


-- 3. Krijo tabelën e Historikut të Kontakteve (Leads)
CREATE TABLE IF NOT EXISTS public.buyer_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.parts(id) ON DELETE CASCADE,
  status text DEFAULT 'contacted' CHECK (status IN ('contacted', 'sold', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.buyer_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own leads." ON public.buyer_leads 
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can insert leads." ON public.buyer_leads 
FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update leads." ON public.buyer_leads 
FOR UPDATE USING (auth.uid() = seller_id);


-- 4. Krijo tabelën e Vlerësimeve (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews 
FOR SELECT USING (true);
CREATE POLICY "Buyers can leave reviews." ON public.reviews 
FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
