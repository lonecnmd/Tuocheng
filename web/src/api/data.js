// 数据访问层：当前读取 public/data 下的静态文件，后续接入后端只改这里
const BASE = `${import.meta.env.BASE_URL}data/`
const cache = new Map()

function getJSON(name) {
  if (!cache.has(name)) {
    const task = fetch(BASE + name)
      .then((r) => {
        if (!r.ok) throw new Error(`${name} 加载失败（${r.status}）`)
        return r.json()
      })
      .catch((err) => {
        cache.delete(name) // 失败不缓存，允许重试
        throw err
      })
    cache.set(name, task)
  }
  return cache.get(name)
}

export const fetchSite = () => getJSON('site.json')
export const fetchBuildingGeo = () => getJSON('buildings.geojson')
export const fetchBuildingInfo = () => getJSON('buildings.json')

/** 合并几何属性（面积等）和档案信息，找不到返回 null */
export async function fetchBuilding(id) {
  const [geo, info] = await Promise.all([fetchBuildingGeo(), fetchBuildingInfo()])
  const feature = geo.features.find((f) => f.properties.id === id)
  if (!feature && !info[id]) return null
  return { ...(feature?.properties ?? {}), ...(info[id] ?? {}), id }
}