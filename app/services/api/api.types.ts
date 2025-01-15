import { UserSnapshotIn } from "@/models/User"
import { MediaSnapshotIn } from "@/models/Media"
import { EventSnapshotIn } from "@/models/Event"
/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiLoginResponse {
  user: UserSnapshotIn & { profilePicture: MediaSnapshotIn }
  token: string
  exp: number
}

export interface PaginatedResponse<T> {
  docs: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  pagingCounter: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
}

export type PaginationMetadata = Omit<PaginatedResponse<any>, "docs">

export interface LocationType {
  id: string
  name: string
  address: string
  location: [number, number]
  updatedAt: string
  createdAt: string
  owner: UserSnapshotIn
}

export interface ApiEventsResponse extends PaginatedResponse<EventSnapshotIn> {}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * The URL of the socket.
   */
  socketUrl: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}
