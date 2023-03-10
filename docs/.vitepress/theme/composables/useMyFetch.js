import { useFetch } from '@vueuse/core';
import { createFetch, useStorage } from '@vueuse/core'
import shortUUID from 'short-uuid';

export const baseUrl = import.meta.env.VITE_URL || 'http://localhost:8000'

export const useMyFetch = createFetch({
  baseUrl,
  options: {
    async beforeFetch({ options }) {
      const jwt = await getJWT()
      // const { frontmatter } = useData()

      options.headers.Authorization = `Bearer ${jwt}`
      // options.body.append('articleId', frontmatter.value.id)

      return { options }
    },
    onFetchError(ctx) {
      if (ctx.response.status === 403) {
        getJWTForce()
        alert('状态重置，请重新发送即可')
      }
    }
  },
  fetchOptions: {
    mode: 'cors',
  },
})

const getJWT = async () => {
  const jwt = useStorage('my-jwt', '')
  const jwtProDate = useStorage('my-date', 0)

  if (!jwt.value || Date.now() - jwtProDate.value > 3600 * 1000 * 24) {
    console.log('重新登录ing')
    await getJWTForce()
  }
  return jwt.value
}

export const getJWTForce = async () => {
  const name = useStorage('my-id', '');
  const token = useStorage('my-token', '');
  const jwtProDate = useStorage('my-date', 0)
  const jwt = useStorage('my-jwt', '')

  if (!name.value) {
    await register()
  }
  const { data } = await useFetch(baseUrl + '/user/login').post({ name: name.value, token: token.value }).json()
  console.log(data.value)
  if (data.value.message === '密码错误')
    await register()
  jwtProDate.value = data.value.jwtProDate
  jwt.value = data.value.jwt
}

const register = async () => {
  const name = useStorage('my-id', '');
  const token = useStorage('my-token', '');
  name.value = shortUUID.generate()
  token.value = shortUUID.generate()
  const { data } = await useFetch(baseUrl + '/user/signup').post({ name: name.value, token: token.value }).json()
  console.log(data.value)
}