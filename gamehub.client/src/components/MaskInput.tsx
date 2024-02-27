  import React from 'react'
  import InputMask from 'react-input-mask';

  const onlyNumbers = (str: string) => (str.replace(/[^0-9]/g, ''));

  const MaskInput = ({ value, onChange }: any) => {

    function handleChange(e: any) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: onlyNumbers(e.target.value),
        }
      })
    }

    return <InputMask mask="999.999.999-99" value={value} onChange={handleChange} placeholder='000.000.000-00'/>
  }

  export default MaskInput