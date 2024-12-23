/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type {
  ApiConfig,
  ApiEventsResponse,
  ApiFeedResponse,
  ApiLoginResponse,
  PaginationMetadata,
} from "./api.types"
import type { EpisodeSnapshotIn } from "../../models/Episode"
import { UserSnapshotIn } from "@/models/User"
import { EventSnapshotIn } from "@/models/Event"
import { Region } from "react-native-maps"
import { stringify } from "qs-esm"
/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  getDefaultPagination = (page: number, limit: number): PaginationMetadata => ({
    hasNextPage: false,
    hasPrevPage: false,
    limit,
    nextPage: null,
    page,
    pagingCounter: 1,
    prevPage: null,
    totalDocs: 0,
    totalPages: 0,
  })

  async getEvents(
    region: Region,
    page: number = 1,
    limit: number = 100,
  ): Promise<
    | {
        kind: "ok"
        events: EventSnapshotIn[]
        pagination: PaginationMetadata
      }
    | GeneralApiProblem
  > {
    // Calculate the bounding box corners
    const latitudeDelta = region.latitudeDelta / 2
    const longitudeDelta = region.longitudeDelta / 2

    const north = region.latitude + latitudeDelta
    const south = region.latitude - latitudeDelta
    const east = region.longitude + longitudeDelta
    const west = region.longitude - longitudeDelta

    // Create the polygon coordinates array
    const coordinates = [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south], // Close the polygon
    ]

    // Construct the query object
    const queryObject = {
      where: {
        "location.location": {
          within: {
            type: "Polygon",
            coordinates: [coordinates],
          },
        },
      },
      page,
      limit,
    }

    // Convert to query string
    const queryString = stringify(queryObject, {
      addQueryPrefix: true,
      encode: false,
    })

    // Make the API request
    const response: ApiResponse<ApiEventsResponse> = await this.apisauce.get(
      `/api/events${queryString}`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    const { docs, ...pagination } = response.data || {
      docs: [],
      ...this.getDefaultPagination(page, limit),
    }

    return { kind: "ok", events: docs, pagination }
  }

  async login(
    email: string,
    password: string,
  ): Promise<
    | {
        kind: "ok"
        user: UserSnapshotIn
        token: string
        exp: number
      }
    | GeneralApiProblem
  > {
    const response: ApiResponse<ApiLoginResponse> = await this.apisauce.post("/api/users/login", {
      email,
      password,
    })
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const data = response.data
      if (!data?.user) {
        return { kind: "bad-data" }
      }
      const user = {
        ...data.user,
        profilePictureUrl: data.user.profilePicture ? data.user.profilePicture.url : undefined,
      }
      const token = data?.token ?? ""
      const exp = data?.exp ?? 0
      return { kind: "ok", user, token, exp }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   *
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const episodes: EpisodeSnapshotIn[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
