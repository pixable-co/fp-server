import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import usePartnerStore from "../../store.js";

const MyBookingLink = () => {
    const zustandUrl = usePartnerStore((state) => state.partnerProfileUrl);
    const [finalUrl, setFinalUrl] = useState(null);

    // Read cookie manually
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    };

    // Load from cookie or Zustand
    useEffect(() => {
        const cookieUrl = getCookie('partner_profile_url');
        if (cookieUrl) {
            setFinalUrl(cookieUrl);
            return;
        }

        if (zustandUrl) {
            document.cookie = `partner_profile_url=${encodeURIComponent(zustandUrl)}; path=/`;
            setFinalUrl(zustandUrl);
        }
    }, [zustandUrl]);

    // Replace attributes of existing <a> tag (not content)
    useEffect(() => {
        if (!finalUrl) return;

        const icons = document.querySelectorAll('i.fas.fa-link');
        icons.forEach((icon) => {
            const parentLink = icon.closest('a');
            if (parentLink) {
                parentLink.href = finalUrl;
                parentLink.target = '_blank';
                parentLink.rel = 'noopener noreferrer';
                // Leave innerHTML untouched
            }
        });
    }, [finalUrl]);

    return (
        <div>
            {finalUrl ? (
                <a
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <i className="fas fa-link"></i>
                </a>
            ) : (
                <Skeleton.Button active size="small" shape="circle" />
            )}
        </div>
    );
};

export default MyBookingLink;
