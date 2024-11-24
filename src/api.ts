type Config = {
    baseURL: string;
    authType: "Bearer";
};

type RequestConfig = {
    data?: unknown;
    controller?: AbortController;
    requireToken?: boolean;
};

class ApiRequest {
    public baseURL: string | null = null;
    protected authType: "Bearer" = "Bearer";
    protected mode = "cors";
    protected referrer = "no-referrer";

    constructor(config: Config) {
        this.baseURL = config.baseURL;
        this.authType = config.authType;
    }

    async GET(route: string, config?: RequestConfig) {
        if (config?.data) {
            throw new Error("Invalid method call. Can't pass data to GET request.");
        }
    }

    async POST(route: string, config?: RequestConfig) {}

    async PATCH(route: string, config?: RequestConfig) {}

    async PUT(route: string, config?: RequestConfig) {}

    async DELETE(route: string, config?: RequestConfig) {}

    private async getHeaders() {}

    private getBody() {}

    private async handleSuccess() {}

    private async handleError() {}

    private createTimeout() {}
}

export default ApiRequest;

// export const apiRequest = async <D>(method: ApiMethod, url: string, config?: ApiConfig) => {
//     const requireToken = config?.requireToken ?? true;
//     const controller = config?.controller ?? new AbortController();

//     if ((method === "POST" || method === "PATCH" || method === "PUT") && !config?.data) {
//         throw new Error("Data is required for POST, PATCH, PUT");
//     }

//     const headers = await getHeaders(requireToken, config?.data);
//     const id = setTimeout(() => controller.abort(), 20000);

//     const response = await fetch(`${constant.VITE_API_URL}${url}`, {
//         headers,
//         method,
//         mode: "cors",
//         referrer: "no-referrer",
//         signal: controller.signal,
//         body: getBody(config?.data),
//     });

//     clearTimeout(id);

//     const result: D = await handleResponse(response);
//     return result;
// };

// const getBody = (data?: object) => {
//     if (!data) return null;
//     if (data instanceof FormData) return data;
//     return JSON.stringify(data);
// };

// const getHeaders = async (requireToken: boolean, data?: object) => {
//     let token = "";

//     if (requireToken) {
//         token = await getToken();
//     }

//     if (requireToken && !token) {
//         await handleTokenGenerationError();
//     }

//     if (data instanceof FormData) {
//         return { ...(token && { Authorization: `Bearer ${token}` }) };
//     } else {
//         return {
//             Accept: "application/json",
//             "Content-Type": "application/json",
//             ...(token && { Authorization: `Bearer ${token}` }),
//         };
//     }
// };

// const handleResponse = async (response: Response) => {
//     if (!response.ok) await handleError(response);

//     if (response.headers.get("update-token") === "true") {
//         await getToken(true);
//     }

//     if (response.status === 204) return;

//     const contentType = response.headers.get("content-type");

//     if (contentType?.startsWith("application/json")) {
//         return await response.json();
//     }
//     if (contentType?.startsWith("application/pdf")) {
//         const blob = await response.blob();
//         const fileName = response.headers.get("Content-Disposition");

//         return { blob, fileName };
//     }
//     if (
//         contentType?.startsWith("audio/") ||
//         contentType?.startsWith("video/") ||
//         contentType?.startsWith("image/")
//     ) {
//         const blob = await response.blob();
//         const fileName = response.headers.get("Content-Disposition");

//         return { blob, fileName };
//     }

//     return await response.text();
// };

// const handleError = async (response: Response) => {
//     let error;

//     if (response.headers.get("content-type")?.startsWith("application/json")) {
//         error = await response.json();
//     } else {
//         error = await response.text();
//     }

//     if (typeof error === "string") throw Error(error);
//     throw Error("Something went wrong.");
// };

// const handleTokenGenerationError = async () => {
//     const logout = useUser.getState().logout;

//     await auth.signOut();
//     logout();
//     router.navigate("/sign-in");

//     throw new Error("Your session either has expired or is invalid. Please login again.");
// };

// let isInit = false;

// const getToken = async (refresh?: boolean) => {
//     let retries = 0;
//     let token = "";

//     const trigger = async (refresh?: boolean) => {
//         try {
//             if (retries === 3) return;

//             if (!auth.currentUser) {
//                 retries++;
//                 const waitMs = !isInit ? 3000 : retries * 1000;
//                 if (!isInit) isInit = true;

//                 await sleep(waitMs);
//                 await trigger(refresh);
//             } else {
//                 token = await auth.currentUser.getIdToken(refresh);
//             }
//         } catch (e) {
//             if (retries === 3) {
//                 log.error(e);
//             } else {
//                 retries++;
//                 await sleep();
//                 await trigger();
//             }
//         }
//     };

//     await trigger(refresh);

//     return token;
// };
