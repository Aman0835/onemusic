import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="wrapper">
        <div className="circle" />
        <div className="circle" />
        <div className="circle" />

        <div className="shadow" />
        <div className="shadow" />
        <div className="shadow" />
      </div>

      <p className="loading-text">Loading...</p>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: white;

  .wrapper {
    width: 140px;
    height: 46px;
    position: relative;
  }

  .circle {
    width: 16px;
    height: 16px;
    position: absolute;
    border-radius: 50%;
    background-color: #04a72e;
    left: 15%;
    transform-origin: 50%;
    animation: circleBounce 0.5s alternate infinite ease;
  }

  @keyframes circleBounce {
    0% {
      top: 46px;
      height: 4px;
      border-radius: 50%;
      transform: scaleX(1.6);
    }
    40% {
      height: 16px;
      transform: scaleX(1);
    }
    100% {
      top: 0%;
    }
  }

  .circle:nth-child(2) {
    left: 45%;
    animation-delay: 0.15s;
  }

  .circle:nth-child(3) {
    left: auto;
    right: 15%;
    animation-delay: 0.3s;
  }

  .shadow {
    width: 16px;
    height: 4px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.6);
    position: absolute;
    top: 48px;
    left: 15%;
    transform-origin: 50%;
    filter: blur(1px);
    animation: shadowScale 0.5s alternate infinite ease;
  }

  @keyframes shadowScale {
    0% {
      transform: scaleX(1.4);
    }
    40% {
      transform: scaleX(1);
      opacity: 0.7;
    }
    100% {
      transform: scaleX(0.3);
      opacity: 0.4;
    }
  }

  .shadow:nth-child(4) {
    left: 45%;
    animation-delay: 0.15s;
  }

  .shadow:nth-child(5) {
    left: auto;
    right: 15%;
    animation-delay: 0.3s;
  }

  .loading-text {
    font-size: 16px;
    font-weight: 600;
    color: white;
    opacity: 0.9;
    letter-spacing: 0.6px;
    animation: fadePulse 1.5s infinite ease-in-out;
  }

  @keyframes fadePulse {
    0% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.4;
    }
  }

  @media (min-width: 640px) {
    gap: 12px;
    padding: 14px;

    .wrapper {
      width: 180px;
      height: 54px;
    }

    .circle {
      width: 18px;
      height: 18px;
    }

    @keyframes circleBounce {
      0% {
        top: 54px;
        height: 4px;
        border-radius: 50%;
        transform: scaleX(1.6);
      }
      40% {
        height: 18px;
        transform: scaleX(1);
      }
      100% {
        top: 0%;
      }
    }

    .shadow {
      width: 18px;
      top: 56px;
    }

    .loading-text {
      font-size: 22px;
    }
  }

  @media (min-width: 1024px) {
    gap: 14px;
    padding: 20px;

    .wrapper {
      width: 200px;
      height: 60px;
    }

    .circle {
      width: 20px;
      height: 20px;
    }

    @keyframes circleBounce {
      0% {
        top: 60px;
        height: 5px;
        border-radius: 50%;
        transform: scaleX(1.6);
      }
      40% {
        height: 20px;
        transform: scaleX(1);
      }
      100% {
        top: 0%;
      }
    }

    .shadow {
      width: 20px;
      top: 62px;
    }

    .loading-text {
      font-size: 28px;
    }
  }
`;

export default Loader;
