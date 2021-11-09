export const formatNumber = (num: number): string => {
    return String(Math.round(num * 100) / 100)
}