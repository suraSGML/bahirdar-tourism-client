import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import API from '../api/axios';

/**
 * Custom hook for handling form submissions with validation
 */
export const useFormHandler = (onSuccess, endpoint, method = 'post') => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    try {
      let response;
      if (method === 'post') {
        response = await API.post(endpoint, data);
      } else if (method === 'put') {
        response = await API.put(endpoint, data);
      } else if (method === 'patch') {
        response = await API.patch(endpoint, data);
      }

      toast.success(response.data?.message || 'Success!');
      reset();
      onSuccess?.(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      const errorCode = err.response?.data?.code;
      
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(error => {
          toast.error(`${error.field}: ${error.message}`);
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    reset,
    watch,
  };
};

/**
 * Custom hook for handling async form data
 */
export const useAsyncForm = (initialData = {}) => {
  const [formData, setFormData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors({});
      try {
        await onSubmit(formData);
      } catch (err) {
        if (err.response?.data?.errors) {
          const errorMap = {};
          err.response.data.errors.forEach(error => {
            errorMap[error.field] = error.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: err.response?.data?.message || 'An error occurred' });
        }
      } finally {
        setLoading(false);
      }
    };
  };

  const reset = () => {
    setFormData(initialData);
    setErrors({});
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    errors,
    loading,
    reset,
  };
};
