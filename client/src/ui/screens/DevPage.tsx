import PasswordProtected from "../components/PasswordProtected";

interface DevPageProps {
  onSkip: () => void;
}

const DevPage = ({ onSkip }: DevPageProps) => {
  return (
    <PasswordProtected onSkip={onSkip}>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">
          Page de développement
        </h1>
        <p>Cette page est uniquement visible en mode développement.</p>
      </div>
    </PasswordProtected>
  );
};

export default DevPage;
