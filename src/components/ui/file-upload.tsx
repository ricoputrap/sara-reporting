import React, { useEffect, useState } from 'react'
import { read, utils } from 'xlsx';
import { Label } from './label';
import { Input } from './input';

interface Props<T> {
  label: string;
  setData: (data: T[]) => void;
}
function FileUpload<T>({ label, setData }: Props<T>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!selectedFile) return;
    (async () => {
      const ab = await selectedFile.arrayBuffer();

      /* parse */
      const wb = read(ab);

      /* generate array of presidents from the first worksheet */
      const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet
      const data: T[] = utils.sheet_to_json<T>(ws); // generate objects

      setData(data);
    })();
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFile) {
        // Handle the file upload process here
        console.log('Uploading file:', selectedFile.name);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Label>{label}</Label>
        <Input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
        />
      </form>

      {selectedFile && (
        <div>
          <p>Selected file: {selectedFile.name}</p>
          <p>File size: {selectedFile.size} bytes</p>
        </div>
      )}
    </div>
  )
}

export default FileUpload