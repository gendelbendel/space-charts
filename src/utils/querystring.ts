export default function getQueryStringParam(param: string) {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
}
