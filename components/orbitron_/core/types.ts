export interface NebulaIdentity {
    visitorId: string;
    nebulaId: string;
    createdAt: number;
}

export interface Fingerprint {
    ua: string;
    lang: string;
    plat: string;
    tz: string;
    res: string;
    color: number;
    createdAt: number;
}