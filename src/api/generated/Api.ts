/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface DtoCorpus {
  date_create?: string;
  date_finish?: string;
  description?: string;
  id?: number;
  image_url?: string;
  is_liked?: number;
  is_owner?: number;
  likes_count?: number;
  name?: string;
  prep_percent?: number;
  video_url?: string;
  word_count?: number;
}

export interface DtoCorpusList {
  items?: DtoCorpus[];
  page?: number;
  total?: number;
}

export interface DtoLikeRequest {
  like: 0 | 1;
}

export interface DtoLikeResponse {
  is_liked?: number;
  likes_count?: number;
}

export interface DtoLoginRequest {
  /** @maxLength 25 */
  login: string;
  /** @maxLength 72 */
  password: string;
}

export interface DtoLoginResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface DtoPublishCorpus {
  description: string;
  /**
   * @min 0
   * @max 100
   */
  prep_percent: number;
  /**
   * @min 0
   * @max 2147483647
   */
  word_count: number;
}

export interface DtoRegisterUser {
  /** @maxLength 25 */
  login: string;
  /** @maxLength 72 */
  password: string;
}

export interface DtoUser {
  id?: number;
  login?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title API корпусов авторов
 * @version 4.0
 * @baseUrl /api
 * @contact
 *
 * Корпусы текстов потенциальных авторов: каталог, лента, публикация и лайки. Процент предлогов и количество слов задаются при публикации.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  corpora = {
    /**
     * No description
     *
     * @tags Корпусы
     * @name GetCorpora
     * @summary Каталог опубликованных корпусов
     * @request GET:/corpora
     */
    getCorpora: (
      query?: {
        /**
         * Минимальное количество слов
         * @min 0
         * @max 2147483647
         */
        query?: number;
        /**
         * Страница, по 6 корпусов
         * @min 1
         * @default 1
         */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<DtoCorpusList, void>({
        path: `/corpora`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Корпусы
     * @name CreateCorpus
     * @summary Добавить корпус с изображением и видео
     * @request POST:/corpora
     * @secure
     */
    createCorpus: (
      data: {
        /**
         * Название корпуса
         * @maxLength 150
         */
        name: string;
        /**
         * JPEG, PNG, GIF, WebP
         * @format binary
         */
        image?: File;
        /**
         * Короткое вертикальное MP4 или WebM
         * @format binary
         */
        video?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<DtoCorpus, void>({
        path: `/corpora`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Корпусы
     * @name GetCorpusDraft
     * @summary Черновик текущего автора
     * @request GET:/corpora/draft
     * @secure
     */
    getCorpusDraft: (params: RequestParams = {}) =>
      this.request<DtoCorpus, void>({
        path: `/corpora/draft`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Корпусы
     * @name GetCorpusFeed
     * @summary Лента корпусов
     * @request GET:/corpora/feed
     */
    getCorpusFeed: (
      query?: {
        /**
         * ID корпуса
         * @min 1
         */
        id?: number;
        /** Следующий опубликованный корпус; нужен id */
        next?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<DtoCorpus, void>({
        path: `/corpora/feed`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Корпусы
     * @name DeleteCorpus
     * @summary Логически удалить свой корпус
     * @request DELETE:/corpora/{id}
     * @secure
     */
    deleteCorpus: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/corpora/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Корпусы
     * @name SetCorpusLike
     * @summary Установить или снять лайк корпуса
     * @request POST:/corpora/{id}/like
     * @secure
     */
    setCorpusLike: (
      id: number,
      like: DtoLikeRequest,
      params: RequestParams = {},
    ) =>
      this.request<DtoLikeResponse, void>({
        path: `/corpora/${id}/like`,
        method: "POST",
        body: like,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Корпусы
     * @name PublishCorpus
     * @summary Опубликовать свой черновик корпуса
     * @request PUT:/corpora/{id}/publication
     * @secure
     */
    publishCorpus: (
      id: number,
      publication: DtoPublishCorpus,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/corpora/${id}/publication`,
        method: "PUT",
        body: publication,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags Авторы
     * @name RegisterAuthor
     * @summary Зарегистрировать автора
     * @request POST:/users
     */
    registerAuthor: (user: DtoRegisterUser, params: RequestParams = {}) =>
      this.request<DtoUser, void>({
        path: `/users`,
        method: "POST",
        body: user,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Авторы
     * @name LoginAuthor
     * @summary Войти и получить JWT
     * @request POST:/users/login
     */
    loginAuthor: (credentials: DtoLoginRequest, params: RequestParams = {}) =>
      this.request<DtoLoginResponse, void>({
        path: `/users/login`,
        method: "POST",
        body: credentials,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Авторы
     * @name LogoutAuthor
     * @summary Выйти и отозвать текущий JWT
     * @request POST:/users/logout
     * @secure
     */
    logoutAuthor: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/logout`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
}
