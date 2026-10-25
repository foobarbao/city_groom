/**
 * @file Translates API errors into French messages for the user.
 */
import { useI18n } from 'vue-i18n'

import { ApiError, NetworkError } from '../api/http'

/**
 * Returns a function mapping any thrown value to a user-facing message.
 *
 * @example
 * const toMessage = useErrorMessage()
 * try { await fetchLockers() } catch (e) { error.value = toMessage(e) }
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useI18n()
  return (error: unknown) => {
    if (error instanceof NetworkError) return t('errors.network')
    if (error instanceof ApiError && error.status === 404) return t('errors.notFound')
    return t('errors.generic')
  }
}
