'use server';

export async function getProfile() {
  // Hardcoded admin profile – replace with your actual data
  return {
    id: '601ea194-a09b-49c0-9cd1-a0987db38eef',
    email: 'rajtagers@gmail.com',
    name: 'Admin',
  };
}

export async function updateProfile(name: string, currentPassword?: string, newPassword?: string) {
  // For development, just log and return success
  console.log('Profile update would save:', { name, currentPassword, newPassword });
  return { success: true };
}