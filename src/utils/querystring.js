export default function getQueryStringParam(param) {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
}
