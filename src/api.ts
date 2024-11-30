import { Auth } from "firebase/auth";

type ApiConfig = {
    /**
     * Base URL to be used for api requests.
     * @example "https://api.fake.com/v1"
     */
    baseURL: string;
    /**
     * Authentication method for requests. Currently supports only Bearer authentication method.
     * @default "Bearer"
     */
    authType?: "Bearer";
    /**
     * Firebase Auth instance.
     */
    authInstance?: Auth;
    /**
     * Request timeout in milliseconds.
     * @default 20000
     */
    timeoutMs?: number;
};

type RequestConfig = {
    /**
     * Body of the request
     */
    data?: unknown;
    /**
     * Abort controller for canceling requests. If not provided method will generate it's own abort controller instance.
     */
    controller?: AbortController;
    /**
     * Whether or not request should be authenticated.
     * @default true
     */
    authenticate?: boolean;
};

type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

class ApiRequest {
    public baseURL: string | null = null;

    protected authType: "Bearer" = "Bearer";
    protected authInstance: Auth | null = null;
    protected timeoutMs = 20000;

    constructor(config: ApiConfig) {
        this.baseURL = config.baseURL;
        if (config.timeoutMs) this.timeoutMs = config.timeoutMs;
        if (config.authType) this.authType = config.authType;
        if (config.authInstance) this.authInstance = config.authInstance;
    }

    async get<T>(route: string, config?: Omit<RequestConfig, "data">) {
        const response = await this.fetch("GET", route, config);

        if (!response.ok) throw this.handleError(response);
        const result: T = await this.handleSuccess(response);
        return result;
    }

    async post<T>(route: string, config?: RequestConfig) {
        const response = await this.fetch("POST", route, config);

        if (!response.ok) throw this.handleError(response);
        const result: T = await this.handleSuccess(response);
        return result;
    }

    async put<T>(route: string, config?: RequestConfig) {
        const response = await this.fetch("POST", route, config);

        if (!response.ok) throw this.handleError(response);
        const result: T = await this.handleSuccess(response);
        return result;
    }

    async patch<T>(route: string, config?: RequestConfig) {
        const response = await this.fetch("PATCH", route, config);

        if (!response.ok) throw this.handleError(response);
        const result: T = await this.handleSuccess(response);
        return result;
    }

    async delete<T>(route: string, config?: Omit<RequestConfig, "data">) {
        const response = await this.fetch("DELETE", route, config);

        if (!response.ok) throw this.handleError(response);
        const result: T = await this.handleSuccess(response);
        return result;
    }

    protected async fetch(method: RequestMethod, route: string, config?: RequestConfig) {
        const authenticate = config?.authenticate ?? true;
        const controller = config?.controller ?? new AbortController();
        const data = config?.data ?? null;

        if ((method === "GET" || method === "DELETE") && data !== null) {
            throw new Error(`Invalid method call. Can't pass data to ${method} request.`);
        }

        const id = setTimeout(() => controller.abort(), this.timeoutMs);
        const headers = await this.getHeaders({ authenticate });

        const response = await fetch(this.baseURL + route, {
            headers,
            method,
            mode: "cors",
            referrer: "no-referrer",
            signal: controller.signal,
            ...(data && { body: this.getBody({ data }) }),
        });

        clearTimeout(id);

        return response;
    }

    protected async getHeaders({ data, authenticate }: { data?: unknown; authenticate?: boolean }) {
        let token = "";

        if (authenticate) {
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

    protected getBody({ data }: { data?: unknown; authenticate?: boolean }) {
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
        let isInit = false;

        const get = async (refresh?: boolean) => {
            try {
                if (retries === 3) return;

                const currentUser = this.authInstance?.currentUser;

                if (!currentUser) {
                    retries++;
                    const waitMs = !isInit ? 3000 : retries * 1000;
                    if (!isInit) isInit = true;

                    await this.sleep(waitMs);
                    await get(refresh);
                } else {
                    token = await currentUser.getIdToken(refresh);
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
            await this.authInstance?.signOut();
            throw new Error("Your session either has expired or is invalid. Please login again.");
        }

        return token;
    }

    private async sleep(ms: number = 1000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default ApiRequest;
