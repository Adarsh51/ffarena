
import ClerkProvider from '@/components/ClerkProvider';
import TournamentWebsite from '@/components/TournamentWebsite';
import '@/styles/morph.css';

const Index = () => {
  return (
    <ClerkProvider>
      <TournamentWebsite />
    </ClerkProvider>
  );
};

export default Index;
