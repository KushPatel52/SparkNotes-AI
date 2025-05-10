import NavBar from "../components/NavBar";
import Hero from "../components/Hero";

export default function Landing({ onAuthClick }: { onAuthClick: () => void }) {
  return (
    <>
      <NavBar onAuthClick={onAuthClick} />
      <Hero onAuthClick={onAuthClick} />
    </>
  );
}
