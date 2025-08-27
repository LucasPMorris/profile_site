const FORM_URL = 'https://api.web3forms.com/submit';

export const sendMessage = async (formData: FormData) => {

  const object = Object.fromEntries(formData);
  const response = await fetch(FORM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(object),
  });

  const status = response?.status;

  if (status >= 400) { return { status, message: response?.statusText }; }

  const data = await response.json();
  return { status, data };
};
