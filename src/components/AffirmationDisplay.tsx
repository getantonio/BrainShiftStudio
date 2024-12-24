"use client";

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

// Types
type Category = {
  id: string;
  name: string;
  description: string;
  affirmations: Array<{ text: string }>;
};

type AffirmationDisplayProps = {
  categories: Category[];
  onCategoryChange: (categoryId: string) => void;
  onRefresh: () => void;
  currentAffirmations: string[];
};

const AffirmationDisplay = ({
  categories,
  onCategoryChange,
  onRefresh,
  currentAffirmations,
}: AffirmationDisplayProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange(value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Select Affirmation Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={onRefresh}
                className="w-full sm:w-auto"
              >
                Refresh Affirmations
              </Button>
            </div>

            <div className="grid gap-4">
              {currentAffirmations.map((affirmation, index) => (
                <Card key={index} className="p-4">
                  <p className="text-lg">{affirmation}</p>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffirmationDisplay;