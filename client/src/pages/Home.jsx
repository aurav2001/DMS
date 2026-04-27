import React from 'react';
import Navbar from '../components/Landing/Navbar';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import PublicDocuments from '../components/Landing/PublicDocuments';
import HowItWorks from '../components/Landing/HowItWorks';
import Testimonials from '../components/Landing/Testimonials';
import Contact from '../components/Landing/Contact';
import Footer from '../components/Landing/Footer';
import CursorFollower from '../components/Landing/CursorFollower';

const Home = () => {
  return (
    <div className="min-h-screen">
      <CursorFollower />
      <Navbar />
      <Hero />
      <PublicDocuments />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;
