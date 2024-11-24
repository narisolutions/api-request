import { getAuth } from "firebase/auth";

type Config = {
    baseURL: string;
    authType?: "Bearer";
    timeoutMs?: number;
};

type RequestExtra = {
    data?: unknown;
    controller?: AbortController;
    requireToken?: boolean;
};

type RequestRoute = string;

type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

class ApiRequest {
    public baseURL: string | null = null;

    protected isInit = false;
    protected authType: "Bearer" = "Bearer";
    protected mode: RequestMode = "cors";
    protected referrer: ReferrerPolicy = "no-referrer";
    protected timeoutMs = 20000;
    protected auth = getAuth();

    constructor(config: Config) {
        this.baseURL = config.baseURL;
        if (config.timeoutMs) this.timeoutMs = config.timeoutMs;
        if (config.authType) this.authType = config.authType;
    }

    async CALL<D>(method: RequestMethod, route: RequestRoute, extra?: RequestExtra) {
        const data = extra?.data ?? null;
        const requireToken = extra?.requireToken ?? true;
        const controller = extra?.controller ?? new AbortController();

        if ((method === "GET" || method === "DELETE") && data !== null) {
            throw new Error(`Invalid method call. Can't pass data to ${method} request.`);
        }

        const id = setTimeout(() => controller.abort(), this.timeoutMs);

        const headers = await this.getHeaders({ requireToken });
        const body = this.getBody({ data });

        const response = await fetch(this.baseURL + route, {
            headers,
            method,
            mode: this.mode,
            referrer: this.referrer,
            signal: controller.signal,
            ...(body && { body }),
        });

        clearTimeout(id);

        if (!response.ok) return this.handleError(response);
        const result: D = await this.handleSuccess(response);
        return result;
    }

    protected async getHeaders({ data, requireToken }: { data?: unknown; requireToken?: boolean }) {
        let token = "";

        if (requireToken) {
            token = await this.getToken();
        }

        if (data instanceof FormData) {
            return {
                ...(token && {
                    Authorization: `Bearer ${token}`,
                }),
            };
        }

        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token && {
                Authorization: `Bearer ${token}`,
            }),
        };
    }

    protected getBody({ data }: { data?: unknown; requireToken?: boolean }) {
        if (!data) {
            return null;
        }

        if (data instanceof FormData) {
            return data;
        }

        return JSON.stringify(data);
    }

    protected async handleSuccess(response: Response) {
        const contentType = response.headers.get("content-type");

        const isMedia =
            contentType?.startsWith("audio/") ||
            contentType?.startsWith("video/") ||
            contentType?.startsWith("image/");

        const isJson = contentType?.startsWith("application/json");

        const isFile = contentType?.startsWith("application/pdf");

        if (isJson) {
            return await response.json();
        }

        if (isFile || isMedia) {
            const blob = await response.blob();
            const fileName = response.headers.get("Content-Disposition");

            return { blob, ...(fileName && { fileName }) };
        }

        return await response.text();
    }

    protected async handleError(response: Response) {
        let error;

        if (response.headers.get("content-type")?.startsWith("application/json")) {
            error = await response.json();
        } else {
            error = await response.text();
        }

        if (typeof error === "string") throw Error(error);
        throw Error("Something went wrong.");
    }

    private async getToken(refresh?: boolean) {
        let retries = 0;
        let token = "";

        const get = async (refresh?: boolean) => {
            try {
                if (retries === 3) return;

                if (!this.auth.currentUser) {
                    retries++;
                    const waitMs = !this.isInit ? 3000 : retries * 1000;
                    if (!this.isInit) this.isInit = true;

                    await this.sleep(waitMs);
                    await get(refresh);
                } else {
                    token = await this.auth.currentUser.getIdToken(refresh);
                }
            } catch (e) {
                if (retries === 3) {
                    console.error(e);
                } else {
                    retries++;
                    await this.sleep();
                    await get();
                }
            }
        };

        await get(refresh);

        if (!token) {
            await this.auth.signOut();
            throw new Error("Your session either has expired or is invalid. Please login again.");
        }

        return token;
    }

    private async sleep(ms: number = 1000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default ApiRequest;
