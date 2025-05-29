
import React from 'react';
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = 'pk_test_c3VpdGFibGUtYWlyZWRhbGUtNDkuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

interface ClerkProviderProps {
  children: React.ReactNode;
}

const ClerkProvider: React.FC<ClerkProviderProps> = ({ children }) => {
  return (
    <BaseClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {children}
    </BaseClerkProvider>
  );
};

export default ClerkProvider;
