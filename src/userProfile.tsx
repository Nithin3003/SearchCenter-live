// src/pages/UserProfilePage.tsx
import { UserProfile } from '@clerk/clerk-react';
import { Link } from 'react-router-dom'; // Import Link for navigation

const UserProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 flex flex-col items-center">
       <div className="w-full max-w-4xl px-4 mb-6">
         <Link to="/" className="text-indigo-600 hover:text-indigo-800">
           &larr; Back to Search
         </Link>
       </div>
      <div className="flex justify-center items-start w-full max-w-4xl px-4">
        <UserProfile path="/user" routing="path" />
      </div>
    </div>
  );
};

export default UserProfilePage;
