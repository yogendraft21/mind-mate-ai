"use client";

import { Crisp } from "crisp-sdk-web";
import { useEffect } from "react";

export const CrispChat = () => {
    useEffect(() => {
        Crisp.configure("7e6852ad-2c90-4d1a-be25-5528aad3735a");
    }, []);

    return null;
}