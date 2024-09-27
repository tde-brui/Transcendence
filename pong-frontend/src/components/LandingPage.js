// src/components/LandingPage.js
import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './LandingPage.css';

const pages = [
  { id: 1, content: 'Welcome to My Site' },
  { id: 2, content: 'About Us' },
  { id: 3, content: 'Our Services' },
  { id: 4, content: 'Contact Us' }
];

const LandingPage = () => {
  const [index, setIndex] = useState(0);

  const handlePrev = () => {
    setIndex(index === 0 ? pages.length - 1 : index - 1);
  };

  const handleNext = () => {
    setIndex(index === pages.length - 1 ? 0 : index + 1);
  };

  const animation = useSpring({
    opacity: 1,
    transform: 'translateX(0)',
    from: { opacity: 0, transform: 'translateX(100%)' },
    config: { tension: 220, friction: 30 },
    reset: true,
    delay: 100
  });

  return (
    <div className="landing-container">
      <div className="arrow left" onClick={handlePrev}>
        <FaArrowLeft />
      </div>
      <animated.div style={animation} className="content">
        <h1>{pages[index].content}</h1>
      </animated.div>
      <div className="arrow right" onClick={handleNext}>
        <FaArrowRight />
      </div>
    </div>
  );
};

export default LandingPage;
