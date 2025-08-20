import UserStorageSecurityTestComponent from '@/components/test/UserStorageSecurityTest';

export default function TestSecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <UserStorageSecurityTestComponent />
    </div>
  );
}

export const metadata = {
  title: 'User Storage Security Test',
  description: 'Test localStorage security between users',
};
