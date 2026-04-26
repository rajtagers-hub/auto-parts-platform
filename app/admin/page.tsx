import Link from 'next/link';

export default function AdminRedirect() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl text-white">Admin Panel</h1>
        <Link href="/dashboard" className="text-blue-500 underline mt-4 inline-block">
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}