'use client';

import React from 'react';
import { ChatPanel, LiveHeader } from '../../components/live-ui';
import image178 from '../../assets/ECHUU V1 UX_img/image 178.png';
import streamer3d from '../../assets/ECHUU V1 UX_img/Streamer-3d-(replace with 3js).png';
import profileImage from '../../assets/ECHUU V1 UX_img/8be2a2ce948acfa51a3bbed53803b48e 2.png';
import goButton from '../../assets/ECHUU V1 UX_icon/go-btn.svg';
import ellipse457 from '../../assets/ECHUU V1 UX_icon/Ellipse 457.svg';
import ellipse459 from '../../assets/ECHUU V1 UX_icon/Ellipse 459.svg';
import screenshotIcon from '../../assets/ECHUU V1 UX_icon/Group.svg';
import decoLong1 from '../../assets/ECHUU V1 UX_img/fe424fdbe4fd640ad4ec9e5d7e26363b 1.png';
import decoLong2 from '../../assets/ECHUU V1 UX_img/fe424fdbe4fd640ad4ec9e5d7e26363b 2.png';
import gift184 from '../../assets/ECHUU V1 UX_img/image 184.png';
import gift182 from '../../assets/ECHUU V1 UX_img/image 182.png';
import gift181 from '../../assets/ECHUU V1 UX_img/image 181.png';
import gift186 from '../../assets/ECHUU V1 UX_img/image 186.png';
import characterIcon from '../../assets/ECHUU V1 UX_img/Gemini_Generated_Image_unppndunppndunpp (1) 1.png';
import liveSettingIcon from '../../assets/ECHUU V1 UX_img/image 190.png';
import soundSettingIcon from '../../assets/ECHUU V1 UX_img/b2d19cebb7369ec09e51e8da12cd64d2 1.png';
import sceneBaseIcon from '../../assets/ECHUU V1 UX_img/image 183.png';
import sceneOverlayIcon from '../../assets/ECHUU V1 UX_img/image 179.png';
import sceneRibbonIcon from '../../assets/ECHUU V1 UX_img/image 180.png';
import calendarIcon from '../../assets/ECHUU V1 UX_img/8035b537838f81a942811ef8fecd8c5b 1.png';
import accentSmall from '../../assets/ECHUU V1 UX_icon/Vector 262 (Stroke).svg';
import accentMedium from '../../assets/ECHUU V1 UX_icon/Vector 263 (Stroke).svg';
import accentLarge from '../../assets/ECHUU V1 UX_icon/Vector 264 (Stroke).svg';

export default function V1Live1() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans">
      <div
        className="relative"
        style={{
          width: '1703px',
          height: '956px',
          transform: 'scale(var(--v1-scale))',
          transformOrigin: 'top left',
        }}
      >
        <div className="absolute inset-0 bg-white overflow-hidden" />
        {/* Frame 1261157305 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[1703px] h-[957px] bg-[#3F92FF]" />

        {/* image 178 */}
        <img
          src={image178.src}
          alt=""
          className="absolute"
          style={{ left: '0px', top: '0px', width: '1893px', height: '957px', objectFit: 'cover' }}
        />

        {/* Streamer-3d-(replace with 3js) */}
        <img
          src={streamer3d.src}
          alt=""
          className="absolute"
          style={{ left: '188px', top: '-129px', width: '1280px', height: '1086px', objectFit: 'contain' }}
        />

        {/* Header UI */}
        <LiveHeader />

        {/* Chat Panel */}
        <ChatPanel />

        {/* ShortVideoArea-16:9 */}
        <div
          className="absolute"
          style={{
            left: '613px',
            top: '57px',
            width: '848px',
            height: '477px',
            border: '1px dashed #EEFF00',
            transform: 'rotate(90deg)',
          }}
        >
          <div
            className="absolute text-white"
            style={{ left: '19px', top: '10px', width: '38px', height: '12px', fontFamily: 'Subway Ticker', fontWeight: 400, fontSize: '12px', lineHeight: '12px' }}
          >
            9：16
          </div>
          <img src={decoLong1.src} alt="" className="absolute" style={{ left: '-43px', top: '244px', width: '119.85px', height: '250.55px', transform: 'rotate(6.48deg)', objectFit: 'contain' }} />
          <img src={decoLong2.src} alt="" className="absolute" style={{ left: '343px', top: '194px', width: '119.85px', height: '250.55px', transform: 'matrix(-0.99, 0.11, 0.11, 0.99, 0, 0)', objectFit: 'contain' }} />
          <img src={ellipse457.src} alt="" className="absolute" style={{ left: '113.19px', top: '42.87px', width: '138.16px', height: '73.6px', transform: 'rotate(165deg)' }} />
          <div className="absolute" style={{ left: '389px', top: '13px', width: '17px', height: '72px', transform: 'rotate(90deg)' }}>
            <img src={ellipse459.src} alt="" className="absolute" style={{ left: '0px', top: '0px', width: '17px', height: '17px' }} />
          </div>
          <div className="absolute text-[#EEFF00]" style={{ left: '417px', top: '15px', width: '44px', height: '15px', fontFamily: 'MHTIROGLA', fontWeight: 500, fontSize: '14px', lineHeight: '15px' }}>
            On Air
          </div>
          <div className="absolute" style={{ left: '434px', top: '38px', width: '33px', height: '33px', background: 'rgba(0, 0, 0, 0.004)', borderRadius: '8px' }} />
          <div className="absolute" style={{ left: '421px', top: '46px', width: '36px', height: '46px', transform: 'rotate(90deg)' }}>
            <img src={screenshotIcon.src} alt="" className="absolute" style={{ left: '0px', top: '0px', width: '24px', height: '18px' }} />
          </div>
          <div className="absolute text-[#EEFF00]" style={{ left: '421px', top: '73px', width: '46px', height: '9px', fontFamily: 'MHTIROGLA', fontWeight: 500, fontSize: '8px', lineHeight: '9px' }}>
            Screenshot
          </div>
        </div>

        {/* Gift-buttons */}
        <div className="absolute" style={{ left: '1295px', top: '708px', width: '280px', height: '95.03px' }}>
          <div className="absolute" style={{ left: '0px', top: '19px', width: '268px', height: '53px', background: '#EEFF00', borderRadius: '35px' }} />
          <img src={gift184.src} alt="" className="absolute" style={{ left: '208.06px', top: '13.21px', width: '71.94px', height: '71.94px', objectFit: 'contain' }} />
          <img src={gift182.src} alt="" className="absolute" style={{ left: '10px', top: '18.54px', width: '56.84px', height: '56.84px', objectFit: 'contain' }} />
          <img src={gift181.src} alt="" className="absolute" style={{ left: '53.53px', top: '0px', width: '95.03px', height: '95.03px', objectFit: 'contain' }} />
          <img src={gift186.src} alt="" className="absolute" style={{ left: '137px', top: '10.55px', width: '77.27px', height: '77.27px', objectFit: 'contain' }} />
        </div>

        {/* Profile picture */}
        <div className="absolute" style={{ right: '43px', top: '48px', width: '64px', height: '64px', border: '4px solid #EEFF00', borderRadius: '36px', overflow: 'hidden' }}>
          <img src={profileImage.src} alt="" className="absolute" style={{ left: '0px', top: '0px', width: '64px', height: '64px', objectFit: 'cover' }} />
        </div>

        {/* go-btn */}
        <img
          src={goButton.src}
          alt=""
          className="absolute"
          style={{ left: '813px', top: '784px', width: '78px', height: '78px', filter: 'drop-shadow(0px 6px 34.3px #EEFF00)' }}
        />

        {/* Left UIControl */}
        <div
          className="absolute z-40"
          style={{ left: '93px', top: '65.9px', width: '154px', height: '808.1px' }}
        >
        {/* Character Setting-btn */}
        <div className="absolute" style={{ left: '10px', top: '0px', width: '142px', height: '161.1px' }}>
          <img src={characterIcon.src} alt="" className="absolute" style={{ left: '0px', top: '11.6px', width: '142px', height: '142px' }} />
          <img src={accentSmall.src} alt="" className="absolute" style={{ left: '68.9px', top: '16.5px', width: '19px', height: '7px', transform: 'rotate(3.04deg)' }} />
          <img src={accentMedium.src} alt="" className="absolute" style={{ left: '65.9px', top: '8.5px', width: '25.75px', height: '8.13px', transform: 'rotate(3.04deg)' }} />
          <img src={accentLarge.src} alt="" className="absolute" style={{ left: '57.9px', top: '-0.5px', width: '36.89px', height: '11.39px', transform: 'rotate(3.04deg)' }} />
          <div
            className="absolute text-[14px] leading-[15px] text-black"
            style={{ left: '13px', top: '145.6px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}
          >
            Character Setting
          </div>
        </div>

        {/* LiveSetting-btn */}
        <div className="absolute" style={{ left: '7px', top: '168.1px', width: '147px', height: '162px' }}>
          <img src={liveSettingIcon.src} alt="" className="absolute" style={{ left: '0px', top: '0px', width: '147px', height: '147px' }} />
          <div
            className="absolute"
            style={{ left: '25px', top: '52px', width: '78px', height: '63px', background: '#D9D9D9', mixBlendMode: 'multiply', borderRadius: '10px' }}
          />
          <div className="absolute" style={{ left: '46px', top: '74px', width: '36px', height: '20px' }}>
            <div className="absolute" style={{ left: '0px', top: '4.5px', width: '7px', height: '7px', background: '#FF5C5C', borderRadius: '2px' }} />
            <div
              className="absolute text-[12px] leading-[20px] text-[#FF5C5C]"
              style={{ left: '11px', top: '0px', fontFamily: 'Dubai', fontWeight: 700 }}
            >
              LIVE
            </div>
          </div>
          <div
            className="absolute text-[14px] leading-[15px] text-black"
            style={{ left: '38px', top: '146.5px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}
          >
            Live Setting
          </div>
        </div>

        {/* Sound Setting-btn */}
        <div className="absolute" style={{ left: '33px', top: '373.1px', width: '96px', height: '108px' }}>
          <img src={soundSettingIcon.src} alt="" className="absolute" style={{ left: '9px', top: '-0.5px', width: '78px', height: '83px' }} />
          <div
            className="absolute text-[14px] leading-[15px] text-black"
            style={{ left: '0px', top: '92.5px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}
          >
            Sound Setting
          </div>
        </div>

        {/* scene-button */}
        <div className="absolute" style={{ left: '0px', top: '500.1px', width: '154px', height: '165px' }}>
          <img src={sceneBaseIcon.src} alt="" className="absolute" style={{ left: '0px', top: '62.37px', width: '154px', height: '95.16px' }} />
          <img src={sceneOverlayIcon.src} alt="" className="absolute" style={{ left: '2px', top: '-0.5px', width: '149.63px', height: '149.63px' }} />
          <img
            src={sceneRibbonIcon.src}
            alt=""
            className="absolute"
            style={{ left: '43.23px', top: '40.35px', width: '69.02px', height: '69.02px', transform: 'matrix(0.98, -0.18, 0.18, 0.98, 0, 0)' }}
          />
          <div
            className="absolute text-[14px] leading-[15px] text-black"
            style={{ left: '56px', top: '149.5px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}
          >
            Scene
          </div>
        </div>

        {/* Calendar Memory-btn */}
        <div className="absolute" style={{ left: '15px', top: '710.1px', width: '120px', height: '98px' }}>
          <img src={calendarIcon.src} alt="" className="absolute" style={{ left: '20px', top: '-0.5px', width: '80px', height: '80px' }} />
          <div
            className="absolute text-[14px] leading-[15px] text-black"
            style={{ left: '0px', top: '82.5px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}
          >
            Calendar Memory
          </div>
        </div>
        </div>
        <style jsx global>{`
          :root {
            --v1-scale: min(calc(100vw / 1703), calc(100vh / 956));
          }
        `}</style>
      </div>
    </div>
  );
}
